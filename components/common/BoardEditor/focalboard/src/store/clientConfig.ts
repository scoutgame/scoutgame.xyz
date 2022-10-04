
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import type { ClientConfig } from '../config/clientConfig';
import client from '../octoClient';

import type { RootState } from './index';

export const fetchClientConfig = createAsyncThunk(
  'clientConfig/fetchClientConfig',
  async () => client.getClientConfig()
);

const clientConfigSlice = createSlice({
  name: 'config',
  initialState: { value: { telemetry: false, telemetryid: '', enablePublicSharedBoards: false, featureFlags: {} } } as { value: ClientConfig },
  reducers: {
    setClientConfig: (state, action: PayloadAction<ClientConfig>) => {
      state.value = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchClientConfig.fulfilled, (state, action) => {
      state.value = action.payload || { telemetry: false, telemetryid: '', enablePublicSharedBoards: false, featureFlags: {} };
    });
  }
});

export const { setClientConfig } = clientConfigSlice.actions;
export const { reducer } = clientConfigSlice;

export function getClientConfig (state: RootState): ClientConfig {
  return state.clientConfig.value;
}

