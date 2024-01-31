import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class AwsService {
  private s3;
  private bucketName: string | undefined;
  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('aws.bucketName');
    this.s3 = new S3({
      accessKeyId: this.configService.get<string>('aws.accessKey'),
      secretAccessKey: this.configService.get<string>('aws.secretKey'),
    });
  }

  async uploadFile(dataBuffer: Buffer, filename: string) {
    try {
      return await this.s3
        .upload({
          Bucket: this.bucketName,
          Body: dataBuffer,
          Key: `${filename}`,
        })
        .promise();
    } catch (err) {
      console.log(err);
    }
  }

  async deleteFile(filename: string) {
    try {
      return await this.s3
        .deleteObject({
          Bucket: this.bucketName,
          Key: filename,
        })
        .promise();
    } catch (err) {
      console.log(err);
    }
  }
}
