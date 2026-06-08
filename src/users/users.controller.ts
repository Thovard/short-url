import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards
} from "@nestjs/common"
import { UsersService } from "./users.service"
import { CreateUserDto } from "./dto/create-user.dto"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { LoginUserDto } from "./dto/login-user.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { CurrentUser } from "./decorators/current-user.decorator"
import { JwtPayload } from "./types/jwt-payload"

@ApiTags("users")
@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	async createUser(@Body() dto: CreateUserDto) {
		return this.usersService.registerUser(dto)
	}

	@Post("login")
	@HttpCode(HttpStatus.OK)
	loginUser(@Body() dto: LoginUserDto) {
		return this.usersService.login(dto)
	}
	@Get("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	getMe(@CurrentUser() user: JwtPayload) {
		return this.usersService.findById(user.sub)
	}
}
