import React from "react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useState } from "react";
import { ChannelSearchFromTwitch } from "@/types/channel";
import { UserTypeForSteamy } from "@/types/user";
import { useRouter } from "next/navigation";
import { addChannelToSupabase } from "@/queries/channels";

interface SearchChannelsInputProps {
    user: UserTypeForSteamy | null;
}

const SearchChannelsInput = ({ user }: SearchChannelsInputProps) => {
    const router = useRouter();
    const [addChannelText, setAddChannelText] = useState('');
    const [channels, setChannels] = useState<ChannelSearchFromTwitch[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const fetchChannels = async (query: string) => {
        console.log('infetchChannels');
        console.log('user', user);
        console.log('query', query);
        if (!query || !user?.twitch?.provider_token) return;
        setIsLoading(true);

        try {
            const response = await fetch(`https://api.twitch.tv/helix/search/channels?query=${encodeURI(query)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.twitch.provider_token}`,
                    'Client-Id': `${process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID}`,
                }
            });
            const data = await response.json();
            setChannels(data.data); 
        } catch (error) {
            console.error('Error fetching Twitch channels:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: any) => {
        // console.log('input', e?.target?.value || '')
        if (!e.target.value || e.target.value.split('').every((char: string) => char === ' ')) {
            setAddChannelText('');
            setChannels([]);
        } else {
            setAddChannelText(e.target.value.trim());
            fetchChannels(e.target.value.trim());
        }
    };

    const handleAddChannel = async (channel: ChannelSearchFromTwitch) => {
        if (!channel.broadcaster_login || !user?.supabase) return;
        setIsFocused(false);
        setAddChannelText('');
        try {
            await addChannelToSupabase(channel, user.supabase);
            window.location.href = '/channels/' + channel.broadcaster_login;
        } catch (err) {
            console.error('Could not add channel', err)
        }
    }

    return (
        <div className="relative h-fit flex flex-col my-0 md:my-1">
            <div className="relative">
                <input
                    className="shadow-sm appearance-none border border-slate-950 dark:border-white rounded w-full py-2 pl-10 pr-3 dark:text-white dark:bg-slate-950 text-slate-500 bg-white leading-tight focus-shadow-md focus:outline-none focus:shadow-outline"
                    type="text"
                    placeholder="Add Twitch channel"
                    value={addChannelText}
                    onChange={handleInputChange}
                    onKeyDown={() => null}
                    onFocus={() => setIsFocused(true)}
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-white" />
            </div>

            {isFocused && channels.length > 0 && (
                <div className='w-full md:w-full overflow-hidden'>
                    <ul className="absolute top-12 left-0 w-full h-96 overflow-y-scroll bg-white dark:bg-slate-950 border border-slate-950 dark:border-white rounded shadow-lg z-10">
                        {isFocused && isLoading && <li className="px-2 py-4 text-center mt-1 text-slate-500 dark:text-white">Loading...</li>}
                        {channels.map((channel, i) => (
                            <li 
                                key={i}
                                className="flex px-2 py-4 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                onClick={() => handleAddChannel(channel)}
                            >
                                <Image
                                    className="rounded-full border border-slate-500 mr-2"
                                    src={channel?.thumbnail_url
                                        || '/public/images/user-icon-96-white.png'
                                        || '/images/user-icon-96-white.png'
                                    }
                                    width="24"
                                    height="24"
                                    alt={channel?.display_name + ' profile picture'}
                                    priority
                                />
                                <p className={`text-nowrap ${channel?.is_live ? 'text-cyan-500' : 'text-slate-950 dark:text-white'}`}>
                                    {channel?.display_name}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

export default SearchChannelsInput;