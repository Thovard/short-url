import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards
} from "@nestjs/common"
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import { CreateUserDto } from "./dto/create-user.dto"
import { LoginUserDto } from "./dto/login-user.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { RolesGuard } from "./guards/roles.guard"
import { CurrentUser } from "./decorators/current-user.decorator"
import { JwtPayload } from "./types/jwt-payload"

@ApiTags("users")
@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post()
	createUser(@Body() dto: CreateUserDto) {
		return this.usersService.registerUser(dto)
	}

	@Post("login")
	@HttpCode(HttpStatus.OK)
	login(@Body() dto: LoginUserDto) {
		return this.usersService.login(dto)
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	getMe(@CurrentUser() user: JwtPayload) {
		return this.usersService.findById(user.sub)
	}

	@Delete(":id")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@ApiBearerAuth()
	deleteUser(@Param("id") id: string, @CurrentUser() user: JwtPayload) {
		return this.usersService.deleteUser(id, user)
	}
}
