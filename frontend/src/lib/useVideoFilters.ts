import { get, writable } from "svelte/store";
import { goto } from "$app/navigation";
import { base } from "$app/paths";
import { videoStore } from "../stores/videoStore";

export function useVideoFilters() {
    const searchValue = writable("");
    const sortValue = writable("name");
    const tagValue = writable("");
    const dateFrom = writable("");
    const dateTo = writable("");
    const isHidden = writable(false);
    const jumpToPage = writable(1);

    let isMounted = false;
    let lastFilterState = "";
    
    // Derived string to track overall filter state changes
    function getCurrentFiltersString() {
        return `${get(searchValue)}|${get(sortValue)}|${get(tagValue)}|${get(dateFrom)}|${get(dateTo)}|${get(isHidden)}`;
    }

    async function init(searchParams: URLSearchParams) {
        searchValue.set(searchParams.get("search") || "");
        sortValue.set(searchParams.get("sort") || "name");
        tagValue.set(searchParams.get("tag") || "");
        isHidden.set(searchParams.get("hidden") === "true");
        
        const p = parseInt(searchParams.get("page") || "1");
        jumpToPage.set(p);

        lastFilterState = getCurrentFiltersString();

        await videoStore.load(
            get(searchValue),
            get(sortValue),
            p,
            get(tagValue),
            "", // days
            get(dateFrom),
            get(dateTo),
            get(isHidden)
        );
        isMounted = true;
    }

    function syncHiddenFromUrl(urlHiddenParams: string | null) {
        if (!isMounted) return;
        const urlHidden = urlHiddenParams === "true";
        if (urlHidden !== get(isHidden)) {
            isHidden.set(urlHidden);
        }
    }

    function checkFilterChangesAndLoad() {
        if (!isMounted) return;
        const currentFilters = getCurrentFiltersString();
        if (lastFilterState !== "" && lastFilterState !== currentFilters) {
            videoStore.load(
                get(searchValue),
                get(sortValue),
                1,
                get(tagValue),
                "",
                get(dateFrom),
                get(dateTo),
                get(isHidden)
            );
        }
        lastFilterState = currentFilters;
    }

    function syncToUrl(storeState: any, currentSearch: string) {
        if (!isMounted || !storeState) return;
        
        const query = new URLSearchParams();
        if (storeState.search) query.set("search", storeState.search);
        if (storeState.sort !== "name") query.set("sort", storeState.sort);
        if (storeState.selectedTag) query.set("tag", storeState.selectedTag);
        if (storeState.showHidden) query.set("hidden", "true");
        if (storeState.page > 1) query.set("page", storeState.page.toString());
        
        jumpToPage.set(storeState.page);

        const queryString = query.toString();
        const url = queryString ? `?${queryString}` : "";

        if (currentSearch !== (queryString ? `?${queryString}` : "")) {
            goto(`${base}/${url}`, {
                keepFocus: true,
                replaceState: true,
                noScroll: true,
            });
        }
    }

    function setQuickDays(days: string) {
        videoStore.load(get(searchValue), get(sortValue), 1, get(tagValue), days);
    }
    
    function setManualDates(from: string, to: string) {
        dateFrom.set(from);
        dateTo.set(to);
    }
    
    function clearDates() {
        dateFrom.set("");
        dateTo.set("");
        videoStore.load(get(searchValue), get(sortValue), 1, get(tagValue)); 
    }

    function handlePageInput(p: number, maxPage: number) {
        if (!isNaN(p) && p >= 1 && p <= maxPage) {
            videoStore.setPage(p);
        } else {
            jumpToPage.set(get(videoStore).page); // Reset on invalid
        }
    }

    return {
        searchValue,
        sortValue,
        tagValue,
        dateFrom,
        dateTo,
        isHidden,
        jumpToPage,
        init,
        syncHiddenFromUrl,
        checkFilterChangesAndLoad,
        syncToUrl,
        setQuickDays,
        setManualDates,
        clearDates,
        handlePageInput
    };
}
