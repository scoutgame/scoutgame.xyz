// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export interface IUser {
    id: string,
    username: string,
    email: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: Record<string, any>,
    create_at: number,
    update_at: number,
    is_bot: boolean,
    wallet_address?: string
}
