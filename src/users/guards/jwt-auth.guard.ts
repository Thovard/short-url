import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException
} from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Request } from "express"
import { JwtPayload } from "../types/jwt-payload"

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private readonly jwt: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<Request>()
		const token = this.extractToken(request)

		if (!token) {
			throw new UnauthorizedException("Missing token")
		}

		try {
			const payload = await this.jwt.verifyAsync<JwtPayload>(token)
			request["user"] = payload
			return true
		} catch {
			throw new UnauthorizedException("Invalid or expired token")
		}
	}

	private extractToken(request: Request): string | undefined {
		const [type, token] = request.headers.authorization?.split(" ") ?? []
		return type === "Bearer" ? token : undefined
	}
}
