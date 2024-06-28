/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { extractAndLoadChunksLazy, findByPropsLazy, findComponentByCodeLazy, findStoreLazy } from "@webpack";
import { useEffect, useState } from "@webpack/common";


const LinkButton = findComponentByCodeLazy("route:", ",selected:", ",icon:", ",iconClassName:"); // let {route: e, selected: t, icon: n, iconClassName: l, interactiveClassName: r, text: s, children: o, locationState: u, onClick: h, className: _, role: f, "aria-posinset": g, "aria-setsize": m, ...C} = this.props;
const NumberBadge = findComponentByCodeLazy("count:", ",color:", ",disableColor:", ",shape:"); // let {count: t, color: n=o.Z.STATUS_DANGER, disableColor: r=!1, shape: c=l.ROUND, className: d, style: E, ...I} = e;
const QuestsComponent = findComponentByCodeLazy(".questsContainer"); // No nessessary props to include

const questsStore = findStoreLazy("QuestsStore");


const requireSettingsMenu = extractAndLoadChunksLazy(['name:"UserSettings"']);
const nav: NavigationSettings = findByPropsLazy("transitionTo", "transitionToGuild", "getHistory");


// Routes used in this plugin (in case someone wants to add new ones)
const routes = new Map<string, RouteData>();

routes.set("/questsMenu", {
    path: "/questsMenu",
    render: (...props) => <QuestPage {...props} />,
    disableTrack: 1,
    redirectTo: "/channels/@me"
});


const QuestsIcon = () => {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 21.7a8.95 8.95 0 0 1 9 0 1 1 0 0 0 1-1.73c-.6-.35-1.24-.64-1.9-.87.54-.3 1.05-.65 1.52-1.07a3.98 3.98 0 0 0 5.49-1.8.77.77 0 0 0-.24-.95 3.98 3.98 0 0 0-2.02-.76A4 4 0 0 0 23 10.47a.76.76 0 0 0-.71-.71 4.06 4.06 0 0 0-1.6.22 3.99 3.99 0 0 0 .54-5.35.77.77 0 0 0-.95-.24c-.75.36-1.37.95-1.77 1.67V6a4 4 0 0 0-4.9-3.9.77.77 0 0 0-.6.72 4 4 0 0 0 3.7 4.17c.89 1.3 1.3 2.95 1.3 4.51 0 3.66-2.75 6.5-6 6.5s-6-2.84-6-6.5c0-1.56.41-3.21 1.3-4.51A4 4 0 0 0 11 2.82a.77.77 0 0 0-.6-.72 4.01 4.01 0 0 0-4.9 3.96A4.02 4.02 0 0 0 3.73 4.4a.77.77 0 0 0-.95.24 3.98 3.98 0 0 0 .55 5.35 4 4 0 0 0-1.6-.22.76.76 0 0 0-.72.71l-.01.28a4 4 0 0 0 2.65 3.77c-.75.06-1.45.33-2.02.76-.3.22-.4.62-.24.95a4 4 0 0 0 5.49 1.8c.47.42.98.78 1.53 1.07-.67.23-1.3.52-1.91.87a1 1 0 1 0 1 1.73Z" fill="currentColor" />
        </svg>
    );
};


const QuestPage = (props?: any) => {
    const [loadedQuests, setLoaded] = useState<boolean>(false);

    useEffect(() => {
        const loadQuests = async () => {
            await requireSettingsMenu();
            setLoaded(true);
        };

        loadQuests();
    }, []);

    return (
        <main className="quests-container">
            {loadedQuests && <QuestsComponent />}
        </main>
    );
};


const QuestButtonComponent = () => {
    const activeQuests = Array.from(questsStore.quests.values()).filter((q: any) => new Date(q.config.expiresAt).getTime() > Date.now() && q.claimedAt);
    return (
        <ErrorBoundary noop>
            <LinkButton
                text="Quests"
                icon={QuestsIcon}
                route={"/questsMenu"}
            >
                {activeQuests.length > 0 && <NumberBadge count={activeQuests.length} />}
            </LinkButton>
        </ErrorBoundary>
    );
};

const redirectRoute = (ev: BeforeUnloadEvent) => {
    const paths = Array.from(routes.keys());
    const path = nav.getHistory().location.pathname;

    if (paths.includes(path)) {
        const data = routes.get(path);
        ev.preventDefault();
        nav.transitionTo(data?.redirectTo ?? "/channels/@me");
        setTimeout(() => window.location.reload(), 0);
    }
};

export default definePlugin({
    name: "BetterQuests",
    description: "Puts the quest button in more accessibile place.",
    authors: [{ name: "kvba", id: 105170831130234880n }],

    start: () => window.addEventListener("beforeunload", redirectRoute),
    stop: () => window.removeEventListener("beforeunload", redirectRoute),

    get paths() {
        return Array.from(routes.keys());
    },

    get routes() {
        return Array.from(routes.values());
    },

    patches: [
        { // Add new quest button
            find: "\"discord-shop\"",
            replacement: {
                match: /"discord-shop"\),/,
                replace: "$&,$self.QuestButtonComponent(),"
            }
        },
        { // Add new route
            find: ".MESSAGE_REQUESTS,render:",
            replacement: {
                // match: /\((0,.{0,10}\.jsx\)\(.{0,10}\.default,){path:.{0,10}\.\i\.MESSAGE_REQUESTS,.{0,100}?\),/,
                match: /\((0,\i\.jsx\)\(\i\.\i,){path:.\i\.\i\.MESSAGE_REQUESTS,.{0,200}?\),/,
                replace: "$&...$self.routes.map(r => (($1r))),"
            }
        },
        {
            find: 'on("LAUNCH_APPLICATION"',
            replacement: {
                match: /path:\[.{0,500}\i\.MESSAGE_REQUESTS,/,
                replace: "$&...$self.paths,"
            }
        }
    ],

    QuestButtonComponent
});
