/// <reference types="vite/client" />

declare module '*.jsx' {
    const component: any;
    export default component;
}

declare module './pages/CostOfLiving/CostOfLiving' {
    const CostOfLiving: any;
    export default CostOfLiving;
}
