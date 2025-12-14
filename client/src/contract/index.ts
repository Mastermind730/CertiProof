import contract from "./DocStamp.json";

export const ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x1F8706dCAdb3e7b99AdA523F20F18506e3620686"
export const {abi:ABI} =contract;