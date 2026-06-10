/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication, ValidationPipe } from "@nestjs/common"
import request from "supertest"
import { AppModule } from "../app.module"
import { PrismaService } from "../prisma/prisma.service"

describe("Users (e2e)", () => {
	let app: INestApplication
	let prisma: PrismaService
	let server: ReturnType<INestApplication["getHttpServer"]>

	interface UserResponse {
		id: string
		name: string
		email: string
		role: string
		createdAt: string
		updatedAt: string
		password?: undefined
	}

	interface LoginResponse {
		accessToken: string
	}

	async function createAndLoginUser(app: INestApplication, overrides = {}) {
		const user = {
			name: "Eduardo",
			email: "eduardo@test.com",
			password: "senha12345",
			...overrides
		}

		await request(app.getHttpServer()).post("/users").send(user)
		const login = await request(app.getHttpServer())
			.post("/users/login")
			.send({ email: user.email, password: user.password })

		return {
			accessToken: (login.body as LoginResponse).accessToken,
			email: user.email
		}
	}

	async function createAndLoginAdmin(app: INestApplication) {
		const admin = {
			name: "Admin",
			email: "admin@test.com",
			password: "senha12345"
		}

		const created = await request(app.getHttpServer())
			.post("/users")
			.send(admin)

		await prisma.user.update({
			where: { id: (created.body as UserResponse).id },
			data: { role: "ADMIN" }
		})

		const login = await request(app.getHttpServer())
			.post("/users/login")
			.send({ email: admin.email, password: admin.password })

		return {
			accessToken: (login.body as LoginResponse).accessToken,
			id: (created.body as UserResponse).id
		}
	}

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AppModule]
		}).compile()

		app = module.createNestApplication()

		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true
			})
		)

		await app.init()
		server = app.getHttpServer()
		prisma = module.get<PrismaService>(PrismaService)
	})

	afterAll(async () => {
		await app.close()
	})

	afterEach(async () => {
		await prisma.user.deleteMany()
	})

	describe("POST /users", () => {
		it("should create a user and return it without password", async () => {
			const response = await request(app.getHttpServer())
				.post("/users")
				.send({
					name: "Eduardo",
					email: "eduardo@test.com",
					password: "senha12345"
				})
				.expect(201)

			expect(response.body).toMatchObject({
				name: "Eduardo",
				email: "eduardo@test.com"
			})
			expect((response.body as UserResponse).password).toBeUndefined()
			expect((response.body as UserResponse).id).toBeDefined()
		})

		it("should return 400 if email is invalid", async () => {
			await request(app.getHttpServer())
				.post("/users")
				.send({
					name: "Eduardo",
					email: "email-invalido",
					password: "senha12345"
				})
				.expect(400)
		})

		it("should return 400 if password is too short", async () => {
			await request(app.getHttpServer())
				.post("/users")
				.send({
					name: "Eduardo",
					email: "eduardo@test.com",
					password: "123"
				})
				.expect(400)
		})

		it("should return 409 if email already exists", async () => {
			await request(server).post("/users").send({
				name: "Eduardo",
				email: "eduardo@test.com",
				password: "senha12345"
			})

			await request(app.getHttpServer())
				.post("/users")
				.send({
					name: "Eduardo",
					email: "eduardo@test.com",
					password: "senha12345"
				})
				.expect(409)
		})
	})

	describe("POST /users/login", () => {
		beforeEach(async () => {
			await request(app.getHttpServer()).post("/users").send({
				name: "Eduardo",
				email: "eduardo@test.com",
				password: "senha12345"
			})
		})

		it("should return accessToken on valid credentials", async () => {
			const response = await request(app.getHttpServer())
				.post("/users/login")
				.send({
					email: "eduardo@test.com",
					password: "senha12345"
				})
				.expect(200)

			expect((response.body as LoginResponse).accessToken).toBeDefined()
			expect(typeof (response.body as LoginResponse).accessToken).toBe(
				"string"
			)
		})

		it("should return 401 on wrong password", async () => {
			await request(app.getHttpServer())
				.post("/users/login")
				.send({
					email: "eduardo@test.com",
					password: "senhaerrada"
				})
				.expect(401)
		})

		it("should return 401 on non-existent email", async () => {
			await request(app.getHttpServer())
				.post("/users/login")
				.send({
					email: "naoexiste@test.com",
					password: "senha12345"
				})
				.expect(401)
		})

		it("should return 400 if email is missing", async () => {
			await request(app.getHttpServer())
				.post("/users/login")
				.send({
					password: "senha12345"
				})
				.expect(400)
		})
	})

	describe("GET /users/me", () => {
		it("should return current user without password", async () => {
			const { accessToken } = await createAndLoginUser(app)

			const response = await request(app.getHttpServer())
				.get("/users/me")
				.set("Authorization", `Bearer ${accessToken}`)
				.expect(200)

			expect(response.body).toMatchObject({
				name: "Eduardo",
				email: "eduardo@test.com"
			})
			expect(response.body.password).toBeUndefined()
		})

		it("should return 401 if no token is provided", async () => {
			await request(app.getHttpServer()).get("/users/me").expect(401)
		})

		it("should return 401 if token is invalid", async () => {
			await request(app.getHttpServer())
				.get("/users/me")
				.set("Authorization", "Bearer token-invalido")
				.expect(401)
		})
	})

	describe("DELETE /users/:id", () => {
		it("should allow user to delete own account", async () => {
			const { accessToken } = await createAndLoginUser(app)

			const me = await request(app.getHttpServer())
				.get("/users/me")
				.set("Authorization", `Bearer ${accessToken}`)

			const { id } = me.body as UserResponse

			await request(app.getHttpServer())
				.delete(`/users/${id}`)
				.set("Authorization", `Bearer ${accessToken}`)
				.expect(200)
		})

		it("should allow admin to delete any user", async () => {
			const { accessToken: adminToken } = await createAndLoginAdmin(app)

			const { accessToken: userToken } = await createAndLoginUser(app, {
				email: "outro@test.com"
			})

			const me = await request(app.getHttpServer())
				.get("/users/me")
				.set("Authorization", `Bearer ${userToken}`)

			await request(app.getHttpServer())
				.delete(`/users/${me.body.id}`)
				.set("Authorization", `Bearer ${adminToken}`)
				.expect(200)
		})

		it("should return 403 when user tries to delete another user", async () => {
			const { accessToken: userAToken } = await createAndLoginUser(app)

			const { accessToken: userBToken } = await createAndLoginUser(app, {
				email: "outro@test.com"
			})

			const meB = await request(app.getHttpServer())
				.get("/users/me")
				.set("Authorization", `Bearer ${userBToken}`)

			await request(app.getHttpServer())
				.delete(`/users/${meB.body.id}`)
				.set("Authorization", `Bearer ${userAToken}`)
				.expect(403)
		})

		it("should return 401 if no token", async () => {
			await request(app.getHttpServer())
				.delete("/users/qualquer-id")
				.expect(401)
		})
	})
})
