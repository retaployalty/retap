import { IsUUID, IsInt, Min } from 'class-validator';

export class CreateTxDto {
  @IsUUID()
  cardId: string;      // UUID della carta

  @IsInt()
  @Min(1)
  points: number;      // punti da accreditare
}
