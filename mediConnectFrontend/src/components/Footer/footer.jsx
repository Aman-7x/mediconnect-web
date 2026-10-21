import React from 'react';
import './footer.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Footer() {
    return <>
        <footer className="footer">
            <div className="main-container">

                <div className="first-section">
                    <img src="../assets/mediconnectLogo.jpg" alt="Logo" />
                    <p className="footer-desc">
                        Medi Connect is created by Aman Khan to connect patients
                        with the right doctors — and doctors with each other — on one
                        unified platform.
                    </p>
                </div>

                <div className="second-section">
                    <h4>Contact Us</h4>
                    <p><i className="bi bi-telephone"></i>9111-440-529</p>
                    <p><i className="bi bi-envelope"></i> mediconnect.team.support@gmail.com</p>
                    <p><i className="bi bi-geo-alt"></i> Dewas</p>
                </div>

                <div className="third-section">
                    <h4>Copy-right</h4>
                    <p><i className="bi bi-c-circle"></i>mediconnect.team.support@gmail.com</p>
                </div>
            </div>
        </footer>
    </>
}

export default Footer;
