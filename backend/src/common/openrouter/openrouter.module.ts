import { Module } from '@nestjs/common';
import { OpenrouterService } from './openrouter.service';
import { OpenrouterController } from './openrouter.controller';

@Module({
    providers: [OpenrouterService],
    controllers: [OpenrouterController],
    exports: [OpenrouterService]
})
export class OpenrouterModule {}
