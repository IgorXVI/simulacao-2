const ghpages = require('gh-pages')

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'main',
        repo: 'https://github.com/IgorXVI/simulacao-2.git', // Update to point to your repository  
        user: {
            name: 'IgorXVI', // update to use your name
            email: 'inazumaseleven04@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)