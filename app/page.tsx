import "./homepage.css";
import Image from "next/image";

export default function Home() {
    return (
        <main className="Main-ContainerBox">

            {/* Welcome Section */}
            <section className="Welcome-Info">

                <div className="Welcome-Left-Box">
                    <h1><strong>Welcome To SustainWear Charity!</strong></h1>
                    <p>We are the charity that donates your clothes for better purposes!</p>

                    {/* Buttons for Login / Register / Shop */}
                    <div className="Home-Button-area">
                        <a href="/login" className="button">Login</a>
                        <a href="/register" className="button button-outline">Register Here</a>
                        <a href="/charity" className="button button-shop">Shop</a>
                    </div>
                </div>

                <div className="Welcome-Right-Box">
                    <Image
                        src="/home-clothes-donation.png"
                        alt="Image of clothes being donated"
                        width={560}
                        height={360}
                        className="Welcome-Image"
                        priority
                    />
                </div>
            </section>

            {/* How It Works Section */}
            <section className="Home-Info-Section">
                <h2>How does it work</h2>

                <div className="Home-Info-Boxes">
                    <div className="Home-Info-Card">
                        <h3>1. Add your items</h3>
                        <p>Fill out the information of your clothing and what type of clothing it is.</p>
                    </div>

                    <div className="Home-Info-Card">
                        <h3>2. Upload a photo of the Clothing</h3>
                        <p>Upload a clear photo of the clothing in order for us to process it faster.</p>
                    </div>

                    <div className="Home-Info-Card">
                        <h3>3. We review it and respond back</h3>
                        <p>If accepted, we review it and send you drop-off details.</p>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section className="About-Us-Section">
                <h2>About Us!</h2>
                <p>
                    SustainWear is an organisation that helps doners give away their clothes 
                    to people who need them the most. We work with local charities to review 
                    the item and distribute it to people in need — reducing landfill waste 
                    and environmental impact.
                </p>
            </section>

            {/* Categories */}
            <section>
                <h2>Popular Categories</h2>
                {(() => {
                    const categories = ["Clothing", "Men", "Women", "Children", "Coats & Jackets", "Tops"];
                    return (
                        <div className="Category-lists">
                            {categories.map((name) => (
                                <span key={name} className="Category-Type">{name}</span>
                            ))}
                        </div>
                    );
                })()}
            </section>

            {/* Footer */}
            <footer className="Home-Footer">
                <p>2025 SustainWear Charity!</p>
                <p><strong>All Rights Reserved.</strong></p>
            </footer>
        </main>
    );
}
