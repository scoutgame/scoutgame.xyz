import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { DateTime } from 'luxon';
import { getCurrentWeek } from '@packages/dates/utils';
import { getCurrentSeasonStart } from '@packages/dates/utils';

const usdc = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const weth = '0x0000000000000000000000000000000000000000';
const scout = '0xFcDC6813a75dF7eFf31382cB956C1beE4788Dd34';

async function query() {
  // fetch https://box-v3-2-0.api.decent.xyz/api/getBoxAction?arguments={"sender":"0x0000000000000000000000000000000000000000","srcToken":"0x0000000000000000000000000000000000000000","dstToken":"0xBCBAf311ceC8a4EAC0430193A528d9FF27ae38C1","srcChainId":8453,"dstChainId":8453,"slippage":1,"actionType":"swap-action","actionConfig":{"amount":"11107978339807","swapDirection":"exact-amount-in","receiverAddress":"0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d","chainId":8453}}
  const response = await fetch(
    'https://box-v4.api.decentxyz.com/api/getBoxAction?arguments={"sender":"0x66525057AC951a0DB5C9fa7fAC6E056D6b8997E2","srcToken":"' +
      usdc +
      '","dstToken":"0x047157cffb8841a64db93fd4e29fa3796b78466c","srcChainId":8453,"dstChainId":8453,"slippage":1,"actionType":"swap-action","actionConfig":{"amount":"1","swapDirection":"exact-amount-out","receiverAddress":"0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d","chainId":8453}}',
    {
      headers: {
        'x-api-key': '4f081ef9fb975f01984f605620489dfb',
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  console.log(data);
}
query();
