// Particle System
const canvas = document.getElementById('musicCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
const colors = [
    "#FF9ED2", // Pink
    "#9EBAFF", // Blue
    "#FFD700", // Gold
    "#7BFF7B", // Mint
    "#FF6B6B"  // Coral
];

class SparkleParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 12 + 4;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 2 + 1;
        this.velocity = {
            x: Math.cos(this.angle) * this.speed,
            y: Math.sin(this.angle) * this.speed
        };
        this.life = 60 + Math.random() * 40;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
        this.rotation += this.rotationSpeed;
        
        // Gentle physics
        this.velocity.y += 0.03;
        this.velocity.x *= 0.98;
        this.velocity.y *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw star shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(0, this.size);
            ctx.translate(0, this.size);
            ctx.rotate((Math.PI * 2) / 10);
            ctx.lineTo(0, -this.size * 0.5);
            ctx.translate(0, -this.size * 0.5);
            ctx.rotate((Math.PI * 2) / 10);
        }
        
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.min(1, this.life / 60);
        ctx.fill();
        ctx.restore();
    }
} 