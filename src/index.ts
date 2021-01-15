import AeroClient from "@aeroware/aeroclient";
import { config as dotenv } from "dotenv";

dotenv();

const client = new AeroClient({
    token: process.env.TOKEN,
    prefix: ".",
    useDefaults: true,
});
