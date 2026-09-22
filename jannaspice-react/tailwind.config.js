/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        spice: { 50:'#FDF8F6',100:'#F5EBE7',200:'#EED3CA',300:'#E8B09F',400:'#E48A6F',500:'#D86B49',600:'#C25535',900:'#2D2825' },
        sand:  { 50:'#FEFCFA',100:'#F7F3EE',200:'#E8E1D7',300:'#D5C8B8' }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Playfair Display', 'serif']
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(45,40,37,0.08)',
        float: '0 20px 40px -10px rgba(216,107,73,0.2)'
      }
    }
  },
  plugins: []
}
