import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class LoginUserDto {
	@ApiProperty({ example: "john.doe@example.com" })
	@IsEmail()
	@IsNotEmpty()
	email!: string

	@ApiProperty({ example: "password123" })
	@IsString()
	@IsNotEmpty()
	password!: string
}
