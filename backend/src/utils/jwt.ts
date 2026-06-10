import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

export const generateTokens = (payload: JwtPayload, rememberMe: boolean = false) => {
  const tokenPayload = { ...payload, rememberMe };

  const accessToken = jwt.sign(tokenPayload, config.jwt.secret, {
    expiresIn: rememberMe ? '7d' : (config.jwt.expiresIn as string),
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(tokenPayload, config.jwt.refreshSecret, {
    expiresIn: rememberMe ? '30d' : (config.jwt.refreshExpiresIn as string),
  } as jwt.SignOptions);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
};
