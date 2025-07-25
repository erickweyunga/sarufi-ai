import { createInterface } from "readline";
import { stdin, stdout } from "process";
import type { Output, Session, Strategy } from "../types";
import type { Sarufi } from "../core/sarufi";
import { createBuilder } from "../core/builder";
import { shoeSalesStrategy, productCatalogTools } from "./strategies/with-shoes-startegy";


function withShoeSalesStrategy(): Sarufi {
    return createBuilder()
        .withStrategy(shoeSalesStrategy)
        .build();
}


async function main() {
    const ai = withShoeSalesStrategy();

    console.log("Available strategies:", ai.listStrategies());

    const rl = createInterface({
        input: stdin,
        output: stdout
    });


    const userId = `user_${Date.now()}`;
    let session: Session;
    try {
        session = await ai.startSession(userId, "Shoe Sales Bot", {}, productCatalogTools);
        console.log("Bot:", session.initial_message);
    } catch (error) {
        console.error("Error starting session:", error);
        rl.close();
        return;
    }

    const sessionLoop = async () => {
        rl.question("You: ", async (input) => {
            if (input.toLowerCase() === "exit") {
                await ai.endSession(session.session_id);
                console.log("Session ended. Final stats:", ai.getStats());
                console.log("Strategy performance:", ai.getStrategyPerformance("Advanced Shoe Sales Bot"));
                rl.close();
                return;
            }

            try {
                const response: Output = await ai.sendMessage(session.session_id, input, productCatalogTools);
                console.log("Bot:", response.message);

                if (response.session_status !== "active") {
                    console.log(`Session ${response.session_status}. Final stats:`, ai.getStats());
                    console.log("Strategy performance:", ai.getStrategyPerformance("Advanced Shoe Sales Bot"));
                    rl.close();
                    return;
                }

                sessionLoop();
            } catch (error) {
                console.error("Error processing message:", error);
                sessionLoop();
            }
        });
    };

    sessionLoop();
}

main().catch(console.error);