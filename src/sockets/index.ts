// ============================================================
// Socket.io Server — JWT-authenticated, room-based architecture
// ============================================================
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { AuthPayload, UserRole } from '../types';
import { Driver } from '../models/Driver';
import { LocationHistory } from '../models/LocationHistory';

let io: Server;

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── JWT Authentication Middleware ───────────────────────
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ─── Connection Handler ─────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    logger.info('Socket connected', { userId: user.userId, role: user.role });

    // Join user's personal room
    void socket.join(`user:${user.userId}`);

    // Join role-based room
    if (user.role === UserRole.DRIVER) {
      void socket.join('drivers');
      setupDriverHandlers(socket, user);
    }
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      void socket.join('admins');
    }

    // ── Booking Events ──────────────────────────────────────
    socket.on('booking:join', (bookingId: string) => {
      void socket.join(`booking:${bookingId}`);
      logger.debug('User joined booking room', { userId: user.userId, bookingId });
    });

    socket.on('booking:leave', (bookingId: string) => {
      void socket.leave(`booking:${bookingId}`);
    });

    // ── Disconnect ──────────────────────────────────────────
    socket.on('disconnect', (reason: string) => {
      logger.info('Socket disconnected', { userId: user.userId, reason });
    });
  });

  logger.info('✅ Socket.io initialized');
  return io;
}

// ─── Driver-Specific Handlers ─────────────────────────────────
function setupDriverHandlers(socket: Socket, user: AuthPayload): void {
  // Live location update
  socket.on('driver:location', async (data: { coordinates: [number, number]; speed?: number; heading?: number; bookingId?: string }) => {
    try {
      const driver = await Driver.findOne({ userId: user.userId });
      if (!driver) return;

      driver.currentLocation = { type: 'Point', coordinates: data.coordinates };
      driver.lastLocationUpdate = new Date();
      await driver.save();

      await LocationHistory.create({
        driverId: driver._id,
        bookingId: data.bookingId,
        location: { type: 'Point', coordinates: data.coordinates },
        speed: data.speed,
        heading: data.heading,
      });

      // Broadcast to booking room if on trip
      if (data.bookingId) {
        io.to(`booking:${data.bookingId}`).emit('tracking:update', {
          driverId: driver._id.toString(),
          coordinates: data.coordinates,
          speed: data.speed,
          heading: data.heading,
          timestamp: new Date(),
        });
      }

      // Broadcast to admin dashboard
      io.to('admins').emit('driver:location:update', {
        driverId: driver._id.toString(),
        coordinates: data.coordinates,
        isAvailable: driver.isAvailable,
      });
    } catch (err) {
      logger.error('Socket location update error', { error: (err as Error).message });
    }
  });

  // Driver accepting a ride
  socket.on('booking:accept', async (data: { bookingId: string }) => {
    io.to(`booking:${data.bookingId}`).emit('booking:status', {
      bookingId: data.bookingId,
      status: 'accepted',
      driverId: user.userId,
      timestamp: new Date(),
    });
  });

  // Driver rejecting a ride
  socket.on('booking:reject', (data: { bookingId: string }) => {
    io.to(`booking:${data.bookingId}`).emit('booking:driver:rejected', {
      bookingId: data.bookingId,
      driverId: user.userId,
    });
  });

  // Driver availability toggle
  socket.on('driver:availability', (data: { isAvailable: boolean }) => {
    io.to('admins').emit('driver:availability:change', {
      driverId: user.userId,
      isAvailable: data.isAvailable,
    });
  });
}

// ─── Emit Helpers (used by controllers/services) ──────────────
export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

export function emitToBooking(bookingId: string, event: string, data: unknown): void {
  if (io) io.to(`booking:${bookingId}`).emit(event, data);
}

export function emitToDrivers(event: string, data: unknown): void {
  if (io) io.to('drivers').emit(event, data);
}

export function emitToAdmins(event: string, data: unknown): void {
  if (io) io.to('admins').emit(event, data);
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
