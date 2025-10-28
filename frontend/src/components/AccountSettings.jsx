import PopupWrapper from './PopupWrapper'
import accountSettings from '../constants/accountSettings.js'
import { ArrowLeft } from 'lucide-react'

const AccountSettings = ({ handleExpandNavItems: closePopup }) => {
    return (
        <PopupWrapper>

            {/* Nav links component to be used in multiple places */}
            <div
                className={"slide-panel d-flex flex-column"}>

                <div className="d-flex align-items-center justify-content-between mx-2 py-2 border-bottom border-dark mb-3">


                    <h4 className="text-white fw-bold mb-0 ms-1">
                        My Account
                    </h4>

                    {/* close popup button */}
                    <button
                        className="d-flex btn py-1 px-3 "
                        onClick={closePopup}>
                        <ArrowLeft color='white' size={24} />
                    </button>
                </div>

                {accountSettings.map(link => {
                    const IconComponent = link.icon;

                    return (<a
                        key={link.name}
                        href={link.href}
                        className={link.className}>

                        {/* icon */}
                        <IconComponent size={22} />

                        {/* label */}
                        <span className="nav-label">{link.name}</span>
                        {
                            link.name === 'Cart' && (
                                <span className="badge">
                                    2
                                </span>
                            )
                        }
                    </a>)
                }
                )}

            </div>
        </PopupWrapper>
    )
}

export default AccountSettings
