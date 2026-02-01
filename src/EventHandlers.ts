import {
    BondFactory,
    BondToken,
    BondSeries,
    Pool,
    UserPosition,
    Activity,
    PoolSnapshot,
} from "generated";

// Helper to generate IDs
const getPositionId = (user: string, token: string) => `${user}-${token}`;

// 1. BondFactory Handlers
BondFactory.PoolCreated.contractRegister(({ event, context }: any) => {
    context.addBondToken(event.params.bondToken);
    context.addBondSeries(event.params.bondSeries);
});

BondFactory.PoolCreated.handler(async ({ event, context }: any) => {
    const poolId = event.params.poolId.toString();
    const bondTokenAddress = event.params.bondToken.toLowerCase();

    const pool: any = {
        id: poolId,
        poolId: event.params.poolId,
        bondToken: bondTokenAddress,
        bondSeries: event.params.bondSeries.toLowerCase(),
        maturityDate: event.params.maturityDate,
        name: event.params.name,
        symbol: event.params.symbol,
        createdAt: BigInt(event.block.timestamp),
    };
    context.Pool.set(pool);

    const bondTokenEntity: any = {
        id: bondTokenAddress,
        pool_id: poolId,
        totalSupply: 0n,
    };
    context.BondToken.set(bondTokenEntity);
});

// 2. BondToken Handlers
BondToken.Transfer.handler(async ({ event, context }: any) => {
    const amount = event.params.value;
    const from = event.params.from.toLowerCase();
    const to = event.params.to.toLowerCase();
    const tokenAddress = event.srcAddress.toLowerCase();
    const timestamp = BigInt(event.block.timestamp);
    
    // FIX: Đảm bảo txHash không bao giờ null bằng cách check nhiều trường
    const txHash = event.transaction?.hash || event.transactionHash || `unknown_${event.block.number}_${event.logIndex}`;

    let activityType = "TRANSFER";
    if (from === "0x0000000000000000000000000000000000000000") activityType = "MINT";
    else if (to === "0x0000000000000000000000000000000000000000") activityType = "BURN";

    const activityId = `${txHash}_${event.logIndex}`;
    const activity: any = {
        id: activityId,
        activityType: activityType,
        user: activityType === "MINT" ? to : from,
        bondToken: tokenAddress,
        amount: amount,
        timestamp: timestamp,
        txHash: txHash,
    };
    context.Activity.set(activity);

    if (activityType !== "MINT") {
        const senderId = getPositionId(from, tokenAddress);
        let senderPos = await context.UserPosition.get(senderId);
        if (!senderPos) {
            senderPos = { id: senderId, user: from, bondToken: tokenAddress, balance: 0n };
        }
        context.UserPosition.set({ ...senderPos, balance: senderPos.balance - amount });
    }

    if (activityType !== "BURN") {
        const receiverId = getPositionId(to, tokenAddress);
        let receiverPos = await context.UserPosition.get(receiverId);
        if (!receiverPos) {
            receiverPos = { id: receiverId, user: to, bondToken: tokenAddress, balance: 0n };
        }
        context.UserPosition.set({ ...receiverPos, balance: receiverPos.balance + amount });
    }

    let bondToken = await context.BondToken.get(tokenAddress);
    if (bondToken) {
        let newTotalSupply = bondToken.totalSupply;
        if (activityType === "MINT") newTotalSupply += amount;
        else if (activityType === "BURN") newTotalSupply -= amount;

        context.BondToken.set({ ...bondToken, totalSupply: newTotalSupply });

        const dayInternal = Math.floor(Number(timestamp) / 86400);
        const snapshotId = `${bondToken.pool_id}_${dayInternal}`;
        context.PoolSnapshot.set({
            id: snapshotId,
            pool_id: bondToken.pool_id,
            totalSupply: newTotalSupply,
            timestamp: timestamp,
        });
    }
});

BondToken.Approval.handler(async ({ event, context }: any) => {
    // Để trống
});

// 3. BondSeries Handlers
BondSeries.OwnershipTransferred.handler(async ({ event, context }: any) => {
    // Để trống
});
