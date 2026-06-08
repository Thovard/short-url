import { Module } from "@nestjs/common"
import { UsersService } from "./users.service"
import { PrismaModule } from "../prisma/prisma.module"
import { UsersController } from "./users.controller"
import { JwtModule } from "@nestjs/jwt"

@Module({
	imports: [
		PrismaModule,
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			signOptions: { expiresIn: "7d" }
		})
	],
	providers: [UsersService],
	controllers: [UsersController]
})
export class UsersModule {}
