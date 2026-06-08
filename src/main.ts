import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { Logger, ValidationPipe } from "@nestjs/common"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	)

	const config = new DocumentBuilder()
		.setTitle("Short Link API")
		.setDescription("API for creating and managing short links")
		.setVersion("1.0")
		.addBearerAuth()
		.addTag("short-links")
		.build()

	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup("api", app, document)

	const port = process.env.PORT ?? 3000
	await app.listen(port)

	Logger.log(`🚀 Application running on: ${await app.getUrl()}`, "Bootstrap")
}
void bootstrap()
