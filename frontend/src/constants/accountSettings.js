import {
    HelpCircle,
    Home,
    LockKeyhole,
    LogOut,
    ShoppingBagIcon,
    ShoppingCart,
    UserCircle2,
    Trash2Icon
} from 'lucide-react'

const accountSettings = [
        {
            name: 'Cart',
            icon: ShoppingCart,
            href: '#cart',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
        {
            name: 'Orders',
            icon: ShoppingBagIcon ,
            href: '#orders',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
        {
            name: 'Assistance',
            icon: HelpCircle,
            href: '#help',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
        {
            name: 'Personal details',
            icon: UserCircle2,
            href: '#personal-details',
            className: 'nav-item-custom more-nav-items my-1 py-3'

        },
        {
            name: 'Saved Addresses',
            icon: Home,
            href: '#addresses',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
        {
            name: 'Change password',
            icon: LockKeyhole,
            href: '#change-password',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
        {
            name: 'Delete Account',
            icon: Trash2Icon,
            href: '#close',
            className: 'nav-item-custom text-danger more-nav-items my-1 py-3',
        },
        {
            name: 'Logout',
            icon:  LogOut,
            href: '#logout',
            className: 'nav-item-custom more-nav-items my-1 py-3'
        },
    ]

export default accountSettings;