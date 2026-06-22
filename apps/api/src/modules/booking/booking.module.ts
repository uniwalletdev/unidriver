import { Module } from '@nestjs/common';
import { TrustModule } from '../trust/trust.module';
import { BookingService } from './booking.service';

@Module({
  imports: [TrustModule],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
