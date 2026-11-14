import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponse, AuthUser, AuthenticatedUser } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new volunteer donor account' })
  @ApiResponse({ status: 201, description: 'Account created. Returns { accessToken, user }.' })
  @ApiResponse({ status: 400, description: 'Invalid input or unsupported area.' })
  @ApiResponse({ status: 409, description: 'Phone number or email already registered.' })
  signUp(@Body() dto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(dto);
  }

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in as Coordinator or Donor (phone or email + password)' })
  @ApiResponse({ status: 200, description: 'Returns { accessToken, user }.' })
  @ApiResponse({ status: 400, description: 'Missing identifier or password.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Account deactivated.' })
  signIn(@Body() dto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently signed-in user' })
  @ApiResponse({ status: 200, description: 'The authenticated user.' })
  @ApiResponse({ status: 401, description: 'Missing or invalid token.' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<AuthUser> {
    return this.authService.getMe(user.id);
  }
}
