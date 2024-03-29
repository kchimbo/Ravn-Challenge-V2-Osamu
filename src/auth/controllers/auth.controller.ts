import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ValidBody } from '../../utils/decorators';
import { AuthDto } from '../dto/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiProperty,
  ApiQuery,
} from '@nestjs/swagger';
import { GetCurrentUserId } from '../decorators/get-current-user-id.decorator';
import { UserDto } from '../dto/user.dto';
import { TransformDataInterceptor } from '../../utils/transform-data.interceptor';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../types/roles.enum';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: 'Login with a set of existing credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'The login was successful',
  })
  @ApiResponse({
    status: 400,
    description: "There's a validation error with the email/password",
  })
  @ApiResponse({
    status: 401,
    description: 'The credentials are invalid',
  })
  @Post('/login')
  @HttpCode(200)
  async login(@ValidBody() { email, password }: AuthDto) {
    return this.authService.login(email, password);
  }

  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@GetCurrentUserId() userId: number) {
    return this.authService.logout(userId);
  }

  @Post('/refresh')
  async refreshToken(@ValidBody() { refreshToken }: RefreshTokenDto) {
    return this.authService.refreshToken(refreshToken);
  }

  @ApiBearerAuth('access_token')
  @ApiOperation({
    summary: 'Change password of the current user',
  })
  @ApiBody({
    type: ChangePasswordDto,
  })
  @Post('/changePassword')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetCurrentUserId() userId: number,
    @ValidBody() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('/resetPassword')
  @ApiQuery({
    name: 'resetKey',
    required: false,
  })
  @ApiBody({
    type: ResetPasswordDto,
  })
  async resetPassword(
    @ValidBody() resetPasswordDto: ResetPasswordDto,
    @Query('resetKey') resetKey?: string,
  ) {
    return this.authService.resetPassword(resetPasswordDto, resetKey);
  }

  @ApiOperation({
    summary: 'Register a new user',
  })
  @ApiResponse({
    status: 201,
    description: 'The account was successfully created',
  })
  @ApiResponse({
    status: 400,
    description: "There's a validation error with the email/password",
  })
  @ApiResponse({
    status: 409,
    description: 'The credential is already in use',
  })
  @Post('/register')
  async register(@ValidBody() { email, password }: AuthDto) {
    await this.authService.register(email, password);
    return null;
  }

  @ApiOperation({
    summary: 'Get information about the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'The request was successful',
  })
  @ApiResponse({
    status: 401,
    description: 'The token is no longer valid or is missing',
  })
  @ApiBearerAuth('access_token')
  @Get('/me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(new TransformDataInterceptor(UserDto))
  async profile(@GetCurrentUserId() userId: number) {
    return await this.authService.getUser(userId);
  }

  @ApiOperation({
    summary:
      '[test] endpoint to verify that only the manager can access this route',
  })
  @ApiResponse({
    status: 200,
    description: 'The request was successful',
  })
  @ApiResponse({
    status: 401,
    description: 'The token is no longer valid or is missing',
  })
  @ApiResponse({
    status: 403,
    description: "You don't have permissions to access this page",
  })
  @ApiBearerAuth('access_token')
  @Get('/manager')
  @Roles(Role.Manager)
  @UseGuards(JwtAuthGuard, RoleGuard)
  async managerOnly(@GetCurrentUserId() userId: number) {
    return await this.authService.getUser(userId);
  }
}
