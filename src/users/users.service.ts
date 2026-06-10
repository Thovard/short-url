import {
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
	UnauthorizedException
} from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateUserDto } from "./dto/create-user.dto"
import { Prisma } from "@prisma/client"
import * as bcrypt from "bcrypt"
import { JwtService } from "@nestjs/jwt"
import { LoginUserDto } from "./dto/login-user.dto"
import type { JwtPayload } from "./types/jwt-payload"

@Injectable()
export class UsersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService
	) {}

	async registerUser(dto: CreateUserDto) {
		const hashedPassword = await bcrypt.hash(dto.password, 10)
		try {
			const user = await this.prisma.user.create({
				data: {
					...dto,
					password: hashedPassword
				},
				omit: { password: true }
			})
			return user
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException("Email already in use")
			}
			throw error
		}
	}

	async login(dto: LoginUserDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})
		if (!user) {
			throw new UnauthorizedException("Invalid credentials")
		}
		const isPasswordValid = await bcrypt.compare(
			dto.password,
			user.password
		)
		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid credentials")
		}
		const accessToken = await this.jwt.signAsync({
			sub: user.id,
			email: user.email,
			role: user.role
		})
		return { accessToken }
	}

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			omit: { password: true }
		})

		if (!user) {
			throw new NotFoundException("User not found")
		}

		return user
	}

	async deleteUser(targetId: string, requester: JwtPayload) {
		const isSelf = requester.sub === targetId
		const isAdmin = requester.role === "ADMIN"

		if (!isSelf && !isAdmin) {
			throw new ForbiddenException("You can only delete your own account")
		}

		await this.prisma.user.delete({
			where: { id: targetId }
		})

		return { message: "User deleted successfully" }
	}
}
