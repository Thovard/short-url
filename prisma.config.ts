import { expand } from "dotenv-expand"
import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

expand(dotenv.config())

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations"
	},
	datasource: {
		url:
			process.env["DATABASE_URL"] ??
			`postgresql://${process.env["DB_USER"]}:${process.env["DB_PASSWORD"]}@${process.env["DB_HOST"]}:${process.env["DB_PORT"]}/${process.env["DB_NAME"]}?schema=public`
	}
})
