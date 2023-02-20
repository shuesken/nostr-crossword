export type NostrEvent = {
    id: string;
    sig: string;
    kind: number;
    tags: string[][];
    pubkey: string;
    content: string;
    created_at: number;
};