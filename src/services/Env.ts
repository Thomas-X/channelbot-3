import {Service} from "typedi";

export interface EnvOpts {
    HUB_CALLBACK: string,
    PORT: string | number,
    HUB_SECRET: string,
    HUB_PATH: string
}

type EnvReturnTypecasted = Omit<EnvOpts, 'PORT'> & { PORT: number }

@Service()
export class Env {
    get(): EnvReturnTypecasted {
        const {HUB_CALLBACK, PORT, HUB_SECRET, HUB_PATH} = process.env as unknown as EnvOpts;
        return {
            HUB_CALLBACK: HUB_CALLBACK,
            HUB_PATH: HUB_PATH,
            HUB_SECRET: HUB_SECRET,
            PORT: Number(PORT) as number
        }
    }
}
