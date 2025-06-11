import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Controller('rewards-and-checkpoints')
export class RewardsAndCheckpointsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async getRewardsAndCheckpoints(@Query('merchantId') merchantId: string) {
    if (!merchantId) throw new BadRequestException('Missing merchantId');

    // 1. Rewards
    const { data: rewards, error: rewardsError } = await this.supabase.client
      .from('rewards')
      .select('id, name, description, image_path, price_coins, is_active')
      .eq('merchant_id', merchantId);
    if (rewardsError) throw new BadRequestException(rewardsError.message);

    // 2. Checkpoint Offers
    const { data: offers, error: offersError } = await this.supabase.client
      .from('checkpoint_offers')
      .select('id, name, description, total_steps')
      .eq('merchant_id', merchantId);
    if (offersError) throw new BadRequestException(offersError.message);

    // 3. For each offer, get steps and rewards
    const offersWithSteps = await Promise.all(
      offers.map(async (offer) => {
        const { data: steps, error: stepsError } = await this.supabase.client
          .from('checkpoint_steps')
          .select('id, step_number, reward_id, offer_id')
          .eq('offer_id', offer.id)
          .order('step_number', { ascending: true });
        if (stepsError) throw new BadRequestException(stepsError.message);

        // For each step, if reward_id, fetch reward details
        const stepsWithReward = await Promise.all(
          steps.map(async (step) => {
            let reward = null;
            if (step.reward_id) {
              const { data: rewardData, error: rewardError } = await this.supabase.client
                .from('checkpoint_rewards')
                .select('id, name, description, icon')
                .eq('id', step.reward_id)
                .single();
              if (rewardError) throw new BadRequestException(rewardError.message);
              reward = rewardData;
            }
            return { ...step, reward };
          })
        );
        return { ...offer, steps: stepsWithReward };
      })
    );

    return {
      rewards,
      checkpoint_offers: offersWithSteps,
    };
  }
} 