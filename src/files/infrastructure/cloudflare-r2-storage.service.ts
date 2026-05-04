import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { FileStoragePort } from '../application/ports/file-storage.port';

@Injectable()
export class CloudflareR2StorageService implements FileStoragePort {
  private readonly logger = new Logger(CloudflareR2StorageService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.getRequiredConfig('R2_ACCOUNT_ID');
    const accessKeyId = this.getRequiredConfig('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.getRequiredConfig('R2_SECRET_ACCESS_KEY');

    this.validateR2S3Credentials(accountId, accessKeyId, secretAccessKey);

    this.bucketName = this.getRequiredConfig('R2_BUCKET_NAME');
    this.publicUrl = this.getRequiredConfig('R2_PUBLIC_URL').replace(/\/$/, '');
    this.endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(
      `R2 storage initialized bucket=${this.bucketName} endpoint=${this.endpoint} accessKey=${this.maskValue(accessKeyId)} publicUrl=${this.publicUrl}`,
    );
  }

  async upload(params: {
    buffer: Buffer;
    contentType: string;
    originalName: string;
    folder: string;
  }): Promise<{ key: string; url: string }> {
    const extension = this.getExtension(
      params.originalName,
      params.contentType,
    );
    const key = `${params.folder}/${randomUUID()}${extension}`;

    this.logger.log(
      `Uploading object to R2 bucket=${this.bucketName} key=${key} contentType=${params.contentType} size=${params.buffer.length}`,
    );

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: params.buffer,
          ContentType: params.contentType,
        }),
      );
    } catch (error) {
      this.logger.error(
        `R2 upload failed bucket=${this.bucketName} key=${key} endpoint=${this.endpoint} ${this.formatAwsError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    this.logger.log(`R2 upload succeeded bucket=${this.bucketName} key=${key}`);

    return {
      key,
      url: `${this.publicUrl}/${key}`,
    };
  }

  async delete(key: string): Promise<void> {
    this.logger.log(
      `Deleting object from R2 bucket=${this.bucketName} key=${key}`,
    );

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(
        `R2 delete failed bucket=${this.bucketName} key=${key} endpoint=${this.endpoint} ${this.formatAwsError(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }

    this.logger.log(`R2 delete succeeded bucket=${this.bucketName} key=${key}`);
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured`);
    }

    return value;
  }

  private validateR2S3Credentials(
    accountId: string,
    accessKeyId: string,
    secretAccessKey: string,
  ): void {
    if (accessKeyId === accountId) {
      throw new InternalServerErrorException(
        'R2_ACCESS_KEY_ID must be the R2 S3 Access Key ID, not R2_ACCOUNT_ID',
      );
    }

    if (secretAccessKey.startsWith('cfat_')) {
      throw new InternalServerErrorException(
        'R2_SECRET_ACCESS_KEY must be the R2 S3 Secret Access Key, not a Cloudflare API token',
      );
    }

    if (
      accessKeyId.includes('replace-with') ||
      secretAccessKey.includes('replace-with')
    ) {
      throw new InternalServerErrorException(
        'R2 S3 credentials are still placeholders. Create an R2 API token and copy its Access Key ID and Secret Access Key',
      );
    }
  }

  private getExtension(originalName: string, contentType: string): string {
    const extension = extname(originalName);

    if (extension) {
      return extension.toLowerCase();
    }

    const [, subtype] = contentType.split('/');
    return subtype ? `.${subtype}` : '';
  }

  private formatAwsError(error: unknown): string {
    if (!this.isAwsError(error)) {
      return `error=${this.getErrorMessage(error)}`;
    }

    const metadata = error.$metadata;

    return [
      `name=${error.name}`,
      `message=${error.message}`,
      `code=${error.Code ?? 'unknown'}`,
      `httpStatus=${metadata?.httpStatusCode ?? 'unknown'}`,
      `requestId=${metadata?.requestId ?? 'undefined'}`,
      `extendedRequestId=${metadata?.extendedRequestId ?? 'undefined'}`,
      `cfId=${metadata?.cfId ?? 'undefined'}`,
      `attempts=${metadata?.attempts ?? 'unknown'}`,
      `totalRetryDelay=${metadata?.totalRetryDelay ?? 'unknown'}`,
    ].join(' ');
  }

  private isAwsError(error: unknown): error is Error & {
    Code?: string;
    $metadata?: {
      httpStatusCode?: number;
      requestId?: string;
      extendedRequestId?: string;
      cfId?: string;
      attempts?: number;
      totalRetryDelay?: number;
    };
  } {
    return error instanceof Error && '$metadata' in error;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown storage error';
  }

  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '****';
    }

    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
