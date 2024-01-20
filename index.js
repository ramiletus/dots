const canvas = document.querySelector('canvas')

const c = canvas.getContext('2d')

canvas.width = innerWidth
canvas.height = innerHeight

const maxEnemyRadius = 30
const minEnemyRadius = 10
const enemyIntervalMillis = 1000

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y

        this.radius = radius
        this.color = color
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
}

class Projectile {
    constructor(x, y, color, velocity) {
        this.x = x
        this.y = y
        this.radius = 5
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
    
    update() {
        this.draw()
        this.x = this.x + this.velocity.xVelocity
        this.y = this.y + this.velocity.yVelocity
    }
}

class Enemy {
    constructor(x, y, color, velocity) {
        this.x = x
        this.y = y
        this.radius = Math.round(Math.random() * (maxEnemyRadius - minEnemyRadius) + minEnemyRadius)
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.xVelocity
        this.y = this.y + this.velocity.yVelocity
    }
}

const friction = 0.985
class Particle {
    constructor(x, y, color, velocity) {
        this.x = x
        this.y = y
        this.radius = Math.random() * 2
        this.color = color
        this.velocity = velocity
        this.alpha = 1
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.xVelocity
        this.y = this.y + this.velocity.yVelocity
        this.alpha -= 0.01
    }
}

//coordinates of the middle of the screen
const middleX = canvas.width / 2
const middleY = canvas.height / 2

const player = new Player(middleX, middleY, 10, 'white')

//set of projectiles
const projectileArray = []
//set of enemies
const enemiesArray = []
//set of particles
const particleArray = []

function spawnEnemies() {
    setInterval(() => {

        let enemyX
        let enemyY

        //spawn from borders
        //maybe spawn from sides fo the screen
        if (Math.random() < 0.5) {
            enemyX = (Math.random() < 0.5) ? 
                //maybe from left of the screen
                (0 - maxEnemyRadius) : 
                //maybe from right of the screen
                (canvas.width + maxEnemyRadius)
            //with random height
            enemyY = Math.random() * (canvas.height + maxEnemyRadius)
        }
        //maybe spawn from top or bottom of the screen
        else {
            //with random width
            enemyX = Math.random() * (canvas.width + maxEnemyRadius)
            enemyY = (Math.random() < 0.5) ? 
            //maybe from top of the screen
                (0 - maxEnemyRadius) : 
            //maybe from bottom of the screen
                (canvas.height + maxEnemyRadius)
        }

        //angle of the enemy, from the center of the screen
        const enemyAngle = Math.atan2(middleY - enemyY, middleX - enemyX)

        const velocity = {
            //direction of the enemy, towards the center of the screen
            xVelocity: Math.cos(enemyAngle),
            yVelocity: Math.sin(enemyAngle)
        }

        const newEnemy = new Enemy(enemyX, enemyY, `hsl(${Math.random() * 360}, 50%, 50%)`, velocity)

        enemiesArray.push(newEnemy)
    }, enemyIntervalMillis)
}

let animationId
function animate() {
    animationId = requestAnimationFrame(animate)

    c.fillStyle = 'rgba(0, 0, 0, 0.1)'

    c.fillRect(0, 0, canvas.width, canvas.height)
    player.draw()

    //updating projectiles position
    projectileArray.forEach((proj, projIndex) => {
        proj.update()

        //deleting projectile if it touches borders
        if (   proj.x - proj.radius > canvas.width
            || proj.x + proj.radius < 0
            || proj.y - proj.radius > canvas.height
            || proj.y + proj.radius < 0)
        {
            projectileArray.splice(projIndex, 1)
        }
    })
    
    //updating particles
    particleArray.forEach((particle, particleIndex)=> {
        if (particle.alpha <= 0) {
            particleArray.splice(particleIndex, 1)
        } else {
            particle.update()
        }
    })

    //updating enemies position
    enemiesArray.forEach( (enemy, enemyIndex) => {
        enemy.update()
        const distanceFromEnemyToPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y)
            
        if (distanceFromEnemyToPlayer - enemy.radius - player.radius < 1)
        {
            //end game
            cancelAnimationFrame(animationId)
        }

        //checking collision so we delete enemy and projectile
        projectileArray.forEach((proj, projIndex) => {
            const distanceFromEnemyToProj = Math.hypot(proj.x - enemy.x, proj.y - enemy.y)
            
            //if enemy and projectile collide
            if (distanceFromEnemyToProj - enemy.radius - proj.radius < 1)
            {

                //create explosions
                for (let i = 0; i < 8; i++) {
                    const particle = new Particle(
                        proj.x,
                        proj.y,
                        enemy.color,
                        {
                            xVelocity: (Math.random() - 0.5) * (Math.random() * 6),
                            yVelocity: (Math.random() - 0.5) * (Math.random() * 6),
                        }
                    );
                    
                    particleArray.push(particle);
                }

                enemy.radius = enemy.radius - minEnemyRadius

                if (enemy.radius < minEnemyRadius) {
                    setTimeout(() =>
                        { enemiesArray.splice(enemyIndex, 1)}
                    )
                }
                setTimeout(() => {
                    projectileArray.splice(projIndex, 1)
                }, 0)
            }
        })

    })

}

//shooting projectiles whenever user clicks the screen
addEventListener('click',
    (clickEvent) => {
        const projectileAngle = Math.atan2(
            clickEvent.clientY - middleY,
            clickEvent.clientX - middleX)
        const velocity = {
            xVelocity: Math.cos(projectileAngle),
            yVelocity: Math.sin(projectileAngle)
        }

        const projectile = new Projectile(
            middleX,
            middleY,
            'white',
            velocity)
        
        projectileArray.push(projectile)
})

animate()
spawnEnemies()