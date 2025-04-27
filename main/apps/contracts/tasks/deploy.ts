import { task, types } from "hardhat/config"

task("deploy", "Deploy a Review contract")
    .addOptionalParam("semaphore", "Semaphore contract address", undefined, types.string)
    .addOptionalParam("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs, semaphore: semaphoreAddress }, { ethers, run }) => {
        if (!semaphoreAddress) {
            const { semaphore } = await run("deploy:semaphore", {
                logs
            })

            semaphoreAddress = await semaphore.getAddress()
        }

        const ReviewFactory = await ethers.getContractFactory("Review")

        const reviewContract = await ReviewFactory.deploy(semaphoreAddress)

        if (logs) {
            console.info(`Review contract has been deployed to: ${await reviewContract.getAddress()}`)
        }

        return reviewContract
    })
