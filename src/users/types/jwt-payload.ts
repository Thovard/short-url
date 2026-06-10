export type UserRole = "USER" | "ADMIN"
export interface JwtPayload {
	sub: string
	email: string
	role: UserRole
	iat: number
	exp: number
}
