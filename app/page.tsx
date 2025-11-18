import "./homepage.css";
import Image from "next/image";

export default function Home(){
    return (
        <main className="Main-ContainerBox">
            {/*This is the welcome section part of the website - code:*/}
            {/*Left side of the welcome box*/}
            <section className="Welcome-Info">
                <div className="Welcome-Left-Box">
                    <h1><strong>Welcome To SustainWear Charity!</strong></h1>
                    <p>We are the charity that donates your clothes for better purposes!</p>
                
                {/*Buttons for Login/Register*/}
                <div className="Home-Button-area">
                    <a href="/login" className="button">Login</a>
                    <a href="/register" className="button button-outline">Register Here</a>
                </div>
            </div>

            {/*Right side of the welcome box*/}
            <div className="Welcome-Right-Box">
                {/*Image*/}
                <Image
                src="/home-clothes-donation.png" 
                alt="Image of clothes being donated"
                width ={560}
                height={360}
                className="Welcome-Image"
                priority /*Loads image content first*/
                />
            </div>
            </section>
            {/*information stuff section*/}
            
            <section className="Home-Info-Section">
                <h2>How does it work</h2>
                {/*Card Pop-up with short information to showcase what the charity does*/}
                
                {/*Card 1*/}
            <div className="Home-Info-Boxes">
                <div className="Home-Info-Card">
                    <h3>1. Add your items</h3>
                    <p>Fill out the information of your clothing and what type of clothing it is.</p>
                </div>

                {/*Card 2*/}
                <div className="Home-Info-Card">
                <h3>2. Upload a photo of the Clothing</h3>
                <p>Upload a clear photo of the clothing in order for us to process it faster.</p>
                </div>

                {/*Card 3*/}
                <div className="Home-Info-Card">
                <h3>3. We review it and respond back</h3>
                <p>If it accepted, we will review it and send off drop-off details.</p>
                </div>
            </div>
            </section>

            {/*About us section */}
            <section className="About-Us-Section">
                <h2>About Us!</h2>
                    <p>
                        SustainWear is a organistation that helps doners to give away their clothes, to donate it to people who need it the most. 
                        We work with local charities in order to review the clothing item and then accept it and distribute it to the people who 
                        need it the most. We do this so clothes don't go to landfills site, where they will be burnt which causes negative environmental 
                        impacts. We track our environmental inpact by cutting down clothes going to landfills site which CO2 is saved and clothes be going to better places.
                    </p>
                </section>            
            {/*Clothing Catagories section*/}
            <section>
                <h2>Popular Categories</h2>
                {(() => {
                    const categories = ["Clothing","Men","Women","Children","Coats & Jackets","Tops"];
                    return ( 
                    <div className="Category-lists"> 
                    {categories.map((name) => (
                        <span key={name} className="Category-Type">{name}</span>
                    ))}
                    </div>
                );
                })()}
            </section>

                {/* Footer section code below:*/}
            <footer className="Home-Footer">
                <p>2025 SustainWear Charity!</p>
                <p><strong>All Rights Reserved.</strong></p>
            </footer>
        </main>
    );
}
