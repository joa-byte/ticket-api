import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GeminiProvider],
      useFactory: (
        configService: ConfigService,
        geminiProvider: GeminiProvider,
      ) => {
        const provider = configService.get<string>('AI_PROVIDER') ?? 'gemini';

        if (provider !== 'gemini') {
          throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
        }

        return geminiProvider;
      },
    },
  ],
  exports: [AiService],
})
export class AiModule {}
