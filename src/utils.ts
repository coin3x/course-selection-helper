import { array } from "fp-ts";
import { pipe } from "fp-ts/lib/function";
import { Writable, writable } from "svelte/store";
import { afterUpdate, onDestroy } from 'svelte';
import type { _CourseData } from "./types";

export function writableFamily<K, V>(defaultValue: V) {
    let hashmap = new Map<K, Writable<V>>();
    return (k: K) => {
        if(!hashmap.has(k)) hashmap.set(k, writable(defaultValue))
        return hashmap.get(k)
    }
}

// from https://stackoverflow.com/questions/56488202/how-to-persist-svelte-store/61300826#61300826
export function persistentWritable<T>(key : string, startValue : T){
  const { subscribe, set, update } = writable(startValue);
  
  return {
    subscribe,
    set,
    update,
    useLocalStorage: () => {
      const json = localStorage.getItem(key);
      if (json) {
        set(JSON.parse(json));
      }
      
      subscribe(current => {
        localStorage.setItem(key, JSON.stringify(current));
      });
    }
  };
}

export function versionedPersistentWritable<T>(
  key: string,
  startValue: T,
){
  const { subscribe, set, update } = writable(startValue);
  const VersionKey = '_persistentWritableVersion';
  return {
    subscribe,
    set,
    update,
    useVersionedLocalStorage: (
      currentVersion: number,
      upgrade: (previousVersion: number | null, previousData: any) => {
        success: boolean,
        newData?: any,
      },
    ) => {
      const json = localStorage.getItem(key);
      if (json) {
        let parsed = JSON.parse(json);
        let prevVer = parsed[VersionKey];
        let prevData = parsed.data;
        if (typeof prevVer !== 'number') {
          prevVer = null;
          prevData = parsed;
        }
        if (prevVer === null || currentVersion > prevVer) {
          let {success, newData} = upgrade(prevVer, prevData);
          if (success) {
            localStorage.setItem(key, JSON.stringify({ [VersionKey]: currentVersion, data: newData }));
            set(newData);
          }
        } else { // data version matched (or too new)
          set(prevData);
        }
      }
      
      subscribe(current => {
        localStorage.setItem(key, JSON.stringify({ [VersionKey]: currentVersion, data: current }));
      });
    }
  };
}

//https://stackoverflow.com/questions/840781/get-all-non-unique-values-i-e-duplicate-more-than-one-occurrence-in-an-array/840808#840808
export function findDuplicates<T>(arr: T[]) { 
    let sorted_arr = arr.slice().sort(); // You can define the comparing function here. 
    // JS by default uses a crappy string compare.
    // (we use slice to clone the array so the
    // original array won't be modified)
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if ( sorted_arr[i + 1] == sorted_arr[i] 
        && results[results.length-1] != sorted_arr[i] /* check duplicated in sorted_arr */ ) { 
        results.push(sorted_arr[i]);
      }
    }
    return results;
}

export const getMaxArraySize = 
    <T,> (xs: T[][]) => 
        pipe(
            xs,
            array.map( x => x.length ),
            array.reduce(0, Math.max)
        )


export function useEffect(cb, deps) {
  console.log(deps())
  let cleanup;
  
  function apply() {
    if (cleanup) cleanup();
    cleanup = cb();
  }
  
  if (deps) {
    let values = [];
    afterUpdate(() => {
      const new_values = deps();
      if (new_values.some((value, i) => value !== values[i])) {
        apply();
        values = new_values;
      }
    });
  } else {
    // no deps = always run
    afterUpdate(apply);
  }
  
  onDestroy(() => {
    if (cleanup) cleanup();
  });
}

export const checkConflict = (needle: _CourseData, selected: _CourseData[]) => {
  for (const hayCourse of selected) {
      if (hayCourse.friendlyId === needle.friendlyId) continue;
      for (const needleLesson of needle.lessons) {
          const needleRange = [needleLesson.ordinal, needleLesson.ordinal + needleLesson.span - 1];
          for (let hayLesson of hayCourse.lessons) {
              if (hayLesson.dayOfWeek !== needleLesson.dayOfWeek) continue;
              const hayRange = [hayLesson.ordinal, hayLesson.ordinal + hayLesson.span - 1];
              // overlap: x1 <= y2 && y1 <= x2
              // From stackoverflow.com/a/3269471
              if (needleRange[0] <= hayRange[1] && hayRange[0] <= needleRange[1]) {
                  return true;
              }
          }
      }
  }
  return false;
};
