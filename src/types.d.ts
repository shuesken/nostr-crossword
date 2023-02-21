export type NostrEvent = {
    id: string;
    sig: string;
    kind: number;
    tags: string[][];
    pubkey: string;
    content: string;
    created_at: number;
};

export type Game = {
    data: CluesInputOriginal,
    meta: any,
    type: string,
    id: string
}