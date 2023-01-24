import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { Body, Controller, Get ,Post,Response, Res} from '@nestjs/common';
const fs = require('fs');

const ffmpeg = require('fluent-ffmpeg');

@Injectable()
export class AppService {
  private S3: AWS.S3;
  private BUCKET: string;
  constructor(private configService: ConfigService) {
    this.S3 = new AWS.S3({
        // Your config options
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
        httpOptions: {
          timeout: 900000 // 15 minutes
          }
       });
    this.BUCKET = process.env.BUCKET_NAME
  }
  getHello(): string {
    return 'Hello World!';
  }

  async videoCompression(data:any){
    try{
      console.log("DATa",data)
      let fileKey = data.fileKey;
      if(fileKey!=""){
        let spilitFileName = fileKey.split(".");
        if(spilitFileName[1] == 'webm'){
          let downloadImageS3 = await this.downloadCompress(data);
          console.log("Download Status",downloadImageS3);
          return  {code:'200', status:'ok', msg:"Please wait - Compression under process. .."} 

         
        }
      }

      return {code:'E23455', status:false, msg:"File name is missing"}
      
    }catch(ex){
      console.log("Exception ",ex);
      return {code:404, status:false, msg:"Something went wrong"}
    } 

  }
 
  async downloadCompress(data:any){
    try{
      console.log("[Debug:]- Downloading S3..");
      let spilitFileName = data.fileKey.split(".");
      let fileName = spilitFileName[0];
      const outputPath = `${__dirname}/assets/${fileName}.mp4`;
      let serverFileName = `${spilitFileName[0]}.mp4`;
      let waterMark = `${__dirname}/assets/watermark.png`;
   
      const tempFileName = `${__dirname}/assets/${data.fileKey}`;
      let params = {
        Bucket: this.BUCKET,
        Key: data.fileKey
    };


      let file = require('fs').createWriteStream(tempFileName);
      let outs = this.S3.getObject(params).createReadStream().pipe(file);
      outs.on('finish',function(){
        console.log("[Debug:]- Downloading Finished S3..");
        console.log("Finish");
      })
      outs.on('close', async function() {
        console.log("[Debug:]- Download Completed S3..");
       
        if(data.order_type == 'business'){
          let resp =  ffmpeg()
          .input(tempFileName)
          .videoCodec('libx264')
          .FPSOutput(25)
          .withOutputFormat('mp4')
          .output(outputPath)
          .on("end", function() {
              console.log("Processing finished successfully");
              const fileContent = fs.readFileSync(outputPath);
              
              this.S3 = new AWS.S3({
                // Your config options
                accessKeyId: process.env.accessKeyId,
                secretAccessKey: process.env.secretAccessKey,
                httpOptions: {
                  timeout: 900000 // 15 minutes
                  }
               });
            this.BUCKET = process.env.BUCKET_NAME
        
            let params = {
              Bucket: this.BUCKET,
              Key: serverFileName,
              Body: fileContent        //got buffer by reading file path
            };
            console.log("[Debug:]- Params ",params);
            
            this.S3.putObject(params, function(err, data) {
              console.log(err, data);
            });
          })
            .run();
            
       
          
        }else{
          let resp =  ffmpeg()
          .input(tempFileName)
          .input(waterMark)
          .complexFilter(
              'overlay=main_w-overlay_w-10:main_h-overlay_h-10'
             /* [
    
                  {
                     // filter: 'overlay',
                     // options: { x: 30, y: 200 },
                      //inputs: 0, outputs: '1'
          
                  },
                  {
                      filter: 'main_w',
                      // options: { x: 30, y: 200 },
                       //inputs: 0, outputs: '1'
           
                   },
                  overlay=main_w-overlay_w-10:main_h-overlay_h-10'
          ]*/)
          
          .videoCodec('libx264')
          .FPSOutput(25)
          //.size('1080x1080')
          //.inputFPS(25)
         // .inputOptions('-crf 28')
          .withOutputFormat('mp4')
          .output(outputPath)
          .on("end", function() {
              console.log("Processing finished successfully");
              const fileContent = fs.readFileSync(outputPath);
              
                  this.S3 = new AWS.S3({
                    // Your config options
                    accessKeyId: process.env.accessKeyId,
                    secretAccessKey: process.env.secretAccessKey,
                    httpOptions: {
                      timeout: 900000 // 15 minutes
                      }
                  });
                this.BUCKET = process.env.BUCKET_NAME
            
                let params = {
                  Bucket: this.BUCKET,
                  Key: serverFileName,
                  Body: fileContent        //got buffer by reading file path
                };
                console.log("[Debug:]- Params ",params);
                
                this.S3.putObject(params, function(err, data) {
                  console.log(err, data);
                });
              
              
            })
            .run();
       

        }
       
     
        
      });
    }catch(ex){
      console.log("Exception Download s3",ex);
      return false;
    }
  }
  
  
  /******** FFMPEG */
  otherFfmpegConverter(inputFile:any,OutputFile:any,fileName:any,waterMark:any){
  try{  
    console.log(inputFile,OutputFile,waterMark,fileName);
      let resp =  ffmpeg()
      .input(inputFile)
      .input(waterMark)
      .complexFilter(
          'overlay=main_w-overlay_w-10:main_h-overlay_h-10'
         /* [

              {
                 // filter: 'overlay',
                 // options: { x: 30, y: 200 },
                  //inputs: 0, outputs: '1'
      
              },
              {
                  filter: 'main_w',
                  // options: { x: 30, y: 200 },
                   //inputs: 0, outputs: '1'
       
               },
              overlay=main_w-overlay_w-10:main_h-overlay_h-10'
      ]*/)
      
      .videoCodec('libx264')
      .FPSOutput(25)
      //.size('1080x1080')
      //.inputFPS(25)
     // .inputOptions('-crf 28')
      .withOutputFormat('mp4')
      .output(OutputFile)
      .on("end", function() {
          console.log("Processing finished successfully");
          const fileContent = fs.readFileSync(OutputFile);
          var params = {
            Bucket: this.BUCKET,
            Key: fileName,
            Body: fileContent        //got buffer by reading file path
          };
          this.S3.putObject(params, function(err, data) {
            console.log(err, data);
          });
        })
        .run();
      return true;

  }catch(ex){
      console.log("Exception in FFMPEG",ex);
      return false;
  }
}

    businessFFmpegConverter(inputFile:any,OutputFile:any,fileName:any){
    try{  
        let resp =  ffmpeg()
        .input(inputFile)
        .complexFilter('overlay=main_w-overlay_w-10:main_h-overlay_h-10')
        
        .videoCodec('libx264')
        .FPSOutput(25)
        .withOutputFormat('mp4')
        .output(OutputFile)
        .on("end", function() {
            console.log("Processing finished successfully");
            const fileContent = fs.readFileSync(OutputFile);
            var params = {
              Bucket: this.BUCKET,
              Key: fileName,
              Body: fileContent        //got buffer by reading file path
            };
            this.S3.putObject(params, function(err, data) {
              console.log(err, data);
            });
          })
          .run();
        return true;
  
    }catch(ex){
        console.log("Exception in Business FFMPEG",ex);
        return false;
    }
  
  }
}
