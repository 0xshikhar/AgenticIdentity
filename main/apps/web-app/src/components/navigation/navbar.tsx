"use client"
import Image from "next/image"
import Link from "next/link"
import Router, { useRouter } from "next/navigation"
import React, { useState } from "react"
import Logo from "../../../public/nebula.png"
import { AiOutlineSearch } from "react-icons/ai"
import { CgProfile } from "react-icons/cg"
import { MdOutlineAccountBalanceWallet } from "react-icons/md"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaFaucetDrip } from "react-icons/fa6"

const style = {
    wrapper: `flex flex-wrap items-center justify-between bg-white w-screen px-[1.2rem] py-[0.8rem] `,
    logoContainer: `flex items-center cursor-pointer`,
    logoText: ` ml-[0.8rem] text-black font-semibold text-2xl`,
    searchBar: `flex flex-1 mx-[0.8rem] w-max-[520px] items-center bg-[#363840] rounded-[0.8rem] hover:bg-[#4c505c]`,
    searchIcon: `text-[#8a939b] mx-3 font-bold text-lg`,
    searchInput: `h-[2.6rem] w-full border-0 bg-transparent outline-0 ring-0 px-2 pl-0 text-[#e6e8eb] placeholder:text-[#8a939b]`,
    headerItems: ` flex items-center align-right justify-end`,
    headerItem: `text-black px-4 font-bold text-[#c8cacd] hover:text-black cursor-pointer`,
    headerIcon: `text-[#8a939b] text-3xl font-black px-4 hover:text-black cursor-pointer`
}

export default function Navbar() {
    const router = useRouter()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    return (
        <div className={style.wrapper}>
            <Link href="/">
                <div className={style.logoContainer}>
                    <Image src={Logo} height={50} width={50} alt="nebula logo" />
                    <div className="text-[32px] text-black font-serif pl-5">NebulaID</div>
                    <div className={style.logoText}></div>
                </div>
            </Link>
            <div
                className={`items-center justify-between ${
                    isMenuOpen && "bg-[#181818c5]"
                } w-full md:flex md:w-auto md:order-1 ${isMenuOpen ? "block" : "hidden"}`}
                id="navbar-sticky"
            >
                <div className={style.headerItems}>
                    {/* <div
						className={style.headerItem}
						onClick={() => {
							router.push("/create");
						}}
					>
						Create Profile
					</div> */}

                    <div
                        className={style.headerItem}
                        onClick={() => {
                            router.push("/")
                        }}
                    >
                        Dashboard
                    </div>

                    <div
                        className={style.headerItem}
                        onClick={() => {
                            router.push("/")
                        }}
                    >
                        Identity
                    </div>

                    <div
                        className={style.headerItem}
                        onClick={() => {
                            router.push("/goverance")
                        }}
                    >
                        Goverance
                    </div>
                </div>
            </div>
            <div className="flex gap-4 md:order-2 space-x-1 md:space-x-0">
                {/* <div className="py-2">
					<Link href="/faucet">
						<FaFaucetDrip className="text-2xl"/>
					</Link>
				</div> */}
                <ConnectButton />
            </div>
        </div>
    )
}
