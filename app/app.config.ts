export default defineAppConfig({
  ui: {
    colorMode: false,
    colors: {
      primary: '#4F46E5',
    },
    button: {
      base: 'cursor-pointer',
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'solid',
          class: 'text-black bg-gray-200 hover:bg-gray-300 active:bg-gray-400 disabled:bg-gray-200 aria-disabled:bg-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500'
        },
      ]
    }
  }
})