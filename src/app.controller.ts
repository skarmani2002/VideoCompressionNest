import { Body, Controller, Get ,Post} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  videoCompression(@Body() body:any) {
    return  this.appService.videoCompression(body);
  }

  @Post('testing')
  testing(@Body() body:any) {
   // return  this.appService.testingVideo(body);
  }
}
