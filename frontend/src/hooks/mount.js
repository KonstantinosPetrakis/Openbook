import { useEffect } from "react"


/**
 * This hook executes a function only once when the component is mounted.
 * This function allows even async functions to be executed when the component is mounted. (useEffect does not allow async functions)
 * Aditionally, it ignores the eslint warning about missing dependencies.
 * @see https://stackoverflow.com/questions/53120972/how-to-call-loading-function-with-react-useeffect-only-once/56767883#56767883
 * @param {function} func the function to execute when the component is mounted. 
 */
export function useMountEffect(func) {
    useEffect(() => {
        func()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}
