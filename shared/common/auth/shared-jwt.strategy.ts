// shared/common/auth/shared-jwt.strategy.ts

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types';

@Injectable()
export class SharedJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject('JWT_SECRET') private jwtSecret: string) {
    console.log('🔑 SharedJwtStrategy constructor - secret:', jwtSecret ? 'Present' : 'Missing');
    console.log('🔑 SharedJwtStrategy constructor - secret length:', jwtSecret?.length);
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    
    console.log('🔑 SharedJwtStrategy initialized successfully');
  }

  async validate(payload: JwtPayload) {
    console.log('🔓 SharedJwtStrategy validate() called with payload:', payload);
    
    // Basic validation - ensure payload contains required fields
    if (!payload || !payload.sub || !payload.email || !payload.role) {
      console.log('❌ SharedJwtStrategy validate - invalid payload structure');
      throw new UnauthorizedException('Invalid token payload');
    }
    
    const user = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      departmentId: payload.departmentId,
    };
    
    console.log('🔓 SharedJwtStrategy returning user:', user);
    return user;
  }
}
