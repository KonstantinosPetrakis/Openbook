import { main as post } from "./post.js";
import { main as user } from "./user.js";
import { main as friends } from "./friends.js"
import { main as notification } from "./notification.js";

async function main() {
    await user();
    console.log("✅ User test passed");
    await friends();
    console.log("✅ Friends test passed");
    await post();
    console.log("✅ Post test passed");
    await notification();
    console.log("✅ Notification test passed");

    console.log("✅✨🎉 All tests passed!");
}


main();