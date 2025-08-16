import React from 'react'
import './Footer.css'

import Vtry from '../Assets/Vtry.jpg'
import facebook_icon from '../Assets/facebook_icon.png'
import tiktok_icon from '../Assets/tiktok_icon.png'

const Footer = () => {
  return (
    <div className='footer'>
      <div className="footer-logo">
        <img src={Vtry} alt="" />
        <p>VTRY</p>
      </div>
      <ul className="footer-links">
        <li>Company</li>
        <li>Products</li>
        <li>Offices</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
      <div className="footer-social-icons">
        <div className="footer-icons-container">
            <img src={facebook_icon} alt="" />
        </div>
        <div className="footer-icons-container">
            <img src={tiktok_icon} alt="" />
        </div>
      </div>
      <div className="footer-copyright">
        <hr />
        <p>Copyright @ 2025 - All Right Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
